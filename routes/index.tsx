import { Head } from "$fresh/runtime.ts";
import Counter from "../islands/Counter.tsx";
import JokeIsland from "../islands/Joke.tsx";
import { JokeComponent } from "../components/JokeComponent.tsx";
import { Handlers, PageProps } from "../fresh/server.ts";
import { trpc } from "../trpc/trpc.ts";
import { queryClient } from "../radio/GlobalProviders.tsx"; 

export const handler: Handlers = {
  async GET(req, ctx) {
    const jokeData = await trpc({ req }).query("joke");
    queryClient.setQueryData(["joke"], jokeData);

    return ctx.render();
  }
}

export default function Home({ trpcCallerContext }: PageProps) {
  return (
    <>
      <Head>
        <title>Fresh App</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <img
          src="/logo.svg"
          class="w-32 h-32"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <p class="my-6">
          Welcome to `fresh`. Try updating this message in the ./routes/index.tsx
          file, and refresh.
        </p>
        <Counter start={3} />
        <p class="my-6">
          Joke got duplicated to show that radio state is shared
        </p>
        <JokeIsland trpcCallerContext={trpcCallerContext} />
        <JokeIsland trpcCallerContext={trpcCallerContext} />
        <p class="my-6">
          This joke is not an island
        </p>
        <JokeComponent trpcCallerContext={trpcCallerContext} />
      </div>
    </>
  );
}
