import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const GlobalProviders: preact.FunctionComponent = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      { /* @ts-ignore preact react ignore children type */ }
      { children }
    </QueryClientProvider>
  )
};
