import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react";

const Tooltip = ({
  content,
  children,
  ...rest
}: {
  content: React.ReactNode;
  children: React.ReactElement;
  [key: string]: any;
}) => (
  <ChakraTooltip.Root {...rest}>
    <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
    <Portal>
      <ChakraTooltip.Positioner>
        <ChakraTooltip.Content>{content}</ChakraTooltip.Content>
      </ChakraTooltip.Positioner>
    </Portal>
  </ChakraTooltip.Root>
);

export default Tooltip;
