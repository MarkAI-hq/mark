// Place at: src/app/record/[studentId]/page.tsx
// This is the PUBLIC shareable URL — anyone with the link can view
// Accessible at: /record/:studentId
//
// For production: add a signed token to the URL for privacy control
// e.g. /record/:studentId?token=xxx

import { Metadata } from "next";
import PublicRecord from "@/components/record/public-record";

export const metadata: Metadata = {
  title: "Proof of Learning · Mirror",
  description: "Verified learning record powered by Mirror Learning Intelligence",
};

export default function PublicRecordPage() {
  return <PublicRecord />;
}