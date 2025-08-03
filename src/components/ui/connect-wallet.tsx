import { Button } from "./button";
import { ConnectButton } from "@xellar/kit";

type ConnectWalletProps = {
  className?: string;
  children?: React.ReactNode;
} & React.ComponentProps<typeof Button>;

export default function ConnectWallet({
  className,
  children,
  ...props
}: ConnectWalletProps) {
  return (
    <ConnectButton.Custom>
      {({ isConnected, account, openConnectModal, openProfileModal }) => (
        <div>
          {isConnected ? (
            <Button onClick={openProfileModal} className={className}>
              {account?.address.substring(0, 6)}...
              {account?.address.substring(account?.address.length - 4)}
            </Button>
          ) : (
            <Button onClick={openConnectModal} className={className} {...props}>
              {children || "Connect Wallet"}
            </Button>
          )}
        </div>
      )}
    </ConnectButton.Custom>
  );
}
