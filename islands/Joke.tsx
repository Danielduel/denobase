import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/Button.tsx";
import { trpc } from "../trpc/trpc.ts";
import type { WithTrpcCallerContext } from "../trpc/TrpcCallerContext.d.ts";

const Joke: preact.FunctionComponent<WithTrpcCallerContext> = ({ trpcCallerContext }) => {
  const { data, refetch } = useQuery(["joke"], async () => await trpc(trpcCallerContext).query("joke"));

  return (
    <div class="flex gap-2 w-full">
      <p class="flex-grow-1 font-bold text-xl">{data}</p>
      <Button onClick={() => refetch()}>Next joke</Button>
    </div>
  );
}

export default Joke;
