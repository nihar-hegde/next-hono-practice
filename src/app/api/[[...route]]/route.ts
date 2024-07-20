import { Hono } from "hono";
import { handle } from "hono/vercel";
import { db } from "../lib/database";
import { InsertTodo, todoTable } from "../lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => {
  return c.json({
    message: "Hello Next.js!",
  });
});

app.get("/todos/get", async (c) => {
  try {
    const todos = await db.query.todoTable.findMany();
    return c.json({ message: "Todos retrieved successfully", todos }, 200);
  } catch (error: any) {
    return c.json(
      {
        message: "Error adding todo",
        error: error.message,
      },
      500 // status code for internal server error
    );
  }
});

app.post("/todos/add", async (c) => {
  try {
    const { title, description } = (await c.req.json()) as InsertTodo;

    // Insert the new todo into the database
    const newTodo = await db
      .insert(todoTable)
      .values({ title, description, isCompleted: false })
      .returning();

    // Return a status code, message, and the new todo
    return c.json(
      {
        message: "Todo added successfully",
        todo: newTodo[0], // assuming returning() returns an array
      },
      201 // status code for created
    );
  } catch (error: any) {
    // Handle any errors that may occur
    return c.json(
      {
        message: "Error adding todo",
        error: error.message,
      },
      500 // status code for internal server error
    );
  }
});

app.patch("/todos/update/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));

    const [currentTodo] = await db
      .select()
      .from(todoTable)
      .where(eq(todoTable.id, id))
      .limit(1);

    if (!currentTodo) {
      return c.json({ message: "Todo not found" }, 404);
    }

    // Toggle the isCompleted field
    const updatedTodo = await db
      .update(todoTable)
      .set({ isCompleted: !currentTodo.isCompleted })
      .where(eq(todoTable.id, id))
      .returning();

    // Return a status code, message, and the updated todo
    return c.json(
      {
        message: "Todo updated successfully",
        todo: updatedTodo[0], // assuming returning() returns an array
      },
      200 // status code for OK
    );
  } catch (error: any) {
    return c.json(
      {
        message: "Error adding todo",
        error: error.message,
      },
      500 // status code for internal server error
    );
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
