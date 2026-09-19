import { createApp } from "./app/app";

const port = Number(process.env.PORT ?? 3000);

async function start() {
  const app = await createApp();
  await app.listen({ port });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});