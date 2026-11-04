import { connection } from "next/server";
import { ConfigEditor } from "@/components/admin/config/config-editor";
import { getConfig, getQuiz } from "@/lib/config";

export default async function ConfigPage() {
  await connection();
  return <ConfigEditor initialConfig={getConfig()} initialQuiz={getQuiz()} />;
}
