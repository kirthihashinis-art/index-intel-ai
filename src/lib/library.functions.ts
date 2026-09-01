import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Borrows one physical copy. Race-safe: the DB has a unique index on active borrowings per copy. */
export const borrowBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ bookId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("borrowings")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", data.bookId)
      .eq("status", "borrowed")
      .maybeSingle();
    if (existing) return { success: false as const, message: "You already have this book on loan." };

    const { data: book } = await supabase.from("books").select("id, title").eq("id", data.bookId).maybeSingle();
    if (!book) return { success: false as const, message: "Book not found." };

    const { data: copies } = await supabase
      .from("book_copies")
      .select("id, copy_label")
      .eq("book_id", data.bookId)
      .eq("status", "available")
      .limit(3);
    if (!copies?.length) return { success: false as const, message: "No copies are currently available." };

    for (const copy of copies) {
      const dueDate = new Date(Date.now() + 14 * 864e5).toISOString();
      const { data: row, error } = await supabase
        .from("borrowings")
        .insert({ user_id: userId, book_id: data.bookId, copy_id: copy.id, due_date: dueDate, status: "borrowed" })
        .select("id, due_date")
        .maybeSingle();
      if (error || !row) continue; // copy taken by someone else — try the next one

      await supabase.from("book_copies").update({ status: "borrowed" }).eq("id", copy.id);
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Book borrowed",
        message: `"${book.title}" is due on ${new Date(row.due_date).toLocaleDateString()}.`,
        type: "borrow",
      });
      return { success: true as const, borrowing_id: row.id, due_date: row.due_date, copy_label: copy.copy_label };
    }
    return { success: false as const, message: "All copies were just taken. Please try again." };
  });

export const reserveBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ bookId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: mine } = await supabase
      .from("reservations")
      .select("id, queue_position")
      .eq("user_id", userId)
      .eq("book_id", data.bookId)
      .eq("status", "waiting")
      .maybeSingle();
    if (mine) return { success: true as const, queue_position: mine.queue_position, message: "Already reserved." };

    const { count } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("book_id", data.bookId)
      .eq("status", "waiting");

    const position = (count ?? 0) + 1;
    const { error } = await supabase
      .from("reservations")
      .insert({ user_id: userId, book_id: data.bookId, queue_position: position, status: "waiting" });
    if (error) return { success: false as const, message: "Could not create the reservation." };

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Reservation confirmed",
      message: `You are number ${position} in the queue. We'll notify you when a copy is free.`,
      type: "reservation",
    });
    return { success: true as const, queue_position: position, message: "Reserved." };
  });

/** Completes a return. `verification` records how the shelf placement was confirmed. */
export const returnBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        borrowingId: z.string().uuid(),
        verification: z.enum(["ai_verified", "manual", "librarian_override"]).default("manual"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: borrowing } = await supabase
      .from("borrowings")
      .select("id, user_id, copy_id, book_id, status, books(title)")
      .eq("id", data.borrowingId)
      .maybeSingle();
    if (!borrowing) return { success: false as const, message: "Loan record not found." };
    if (borrowing.status !== "borrowed") return { success: false as const, message: "This loan is already closed." };

    const { error } = await supabase
      .from("borrowings")
      .update({ status: "returned", returned_at: new Date().toISOString(), verification: data.verification })
      .eq("id", borrowing.id);
    if (error) return { success: false as const, message: "You cannot close this loan." };

    // Hand the copy to the next person in the queue, otherwise put it back on the shelf.
    const { data: nextInQueue } = await supabase
      .from("reservations")
      .select("id, user_id, queue_position")
      .eq("book_id", borrowing.book_id)
      .eq("status", "waiting")
      .order("queue_position", { ascending: true })
      .limit(1)
      .maybeSingle();

    const title = (borrowing as { books?: { title?: string } }).books?.title ?? "Your book";

    if (nextInQueue) {
      await supabase.from("book_copies").update({ status: "reserved" }).eq("id", borrowing.copy_id);
      await supabase.from("reservations").update({ status: "ready" }).eq("id", nextInQueue.id);
      await supabase.from("notifications").insert({
        user_id: nextInQueue.user_id,
        title: "Your reserved book is available",
        message: `"${title}" is ready for collection.`,
        type: "reservation",
      });
    } else {
      await supabase.from("book_copies").update({ status: "available" }).eq("id", borrowing.copy_id);
    }

    await supabase.from("notifications").insert({
      user_id: borrowing.user_id === userId ? userId : borrowing.user_id,
      title: "Return complete",
      message:
        data.verification === "ai_verified"
          ? `"${title}" was returned and its shelf placement was AI verified.`
          : `"${title}" was returned.`,
      type: "return",
    });

    return { success: true as const, message: "Return confirmed." };
  });
