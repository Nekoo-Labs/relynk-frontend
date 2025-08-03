import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials?.signature) {
            console.error("Missing credentials");
            return null;
          }

          const siwe = new SiweMessage(JSON.parse(credentials.message));

          // Use the domain from the SIWE message instead of NEXTAUTH_URL
          const result = await siwe.verify({
            signature: credentials.signature,
          });

          console.log("SIWE verification result:", result);

          if (result.success) {
            return {
              id: siwe.address,
              address: siwe.address,
              chainId: siwe.chainId,
            };
          }
          return null;
        } catch (e) {
          console.error("SIWE verification failed:", e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  callbacks: {
    async session({ session, token }) {
      // console.log("Session callback:", { session, token });
      if (token.address) {
        session.address = token.address;
        if (session.user) {
          session.user.address = token.address;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // console.log("JWT callback:", { token, user });
      if (user?.address) {
        token.address = user.address;
        token.sub = user.address;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});

export { handler as GET, handler as POST };
