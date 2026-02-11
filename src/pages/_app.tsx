import type { AppProps } from "next/app";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ChakraProvider value={defaultSystem}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default MyApp;
