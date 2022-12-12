import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const GlobalProviders: preact.FunctionComponent = ({ children }) => {
  queryClient.clear(); // you can remove it if you don't deal with user-specific data

  return (
    <QueryClientProvider client={queryClient}>
      { /* @ts-ignore preact react ignore children type */ }
      { children }
    </QueryClientProvider>
  )
};
