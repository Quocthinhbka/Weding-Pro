// Ứng dụng ngân hàng mở được bằng deeplink của VietQR (https://vietqr.io/deeplink/bank-apps).
// `id` là giá trị tham số `app` của https://dl.vietqr.io/pay.
export const BANK_APPS = [
  { id: "vcb", name: "Vietcombank (VCB Digibank)" },
  { id: "tcb", name: "Techcombank" },
  { id: "mb", name: "MB Bank" },
  { id: "icb", name: "VietinBank (iPay)" },
  { id: "bidv", name: "BIDV SmartBanking" },
  { id: "vba", name: "Agribank Plus" },
  { id: "acb", name: "ACB ONE" },
  { id: "vpb", name: "VPBank NEO" },
  { id: "tpb", name: "TPBank" },
  { id: "hdb", name: "HDBank" },
  { id: "vib", name: "MyVIB" },
  { id: "shb", name: "SHB SAHA" },
  { id: "lpb", name: "LPBank" },
  { id: "ocb", name: "OCB OMNI" },
  { id: "eib", name: "Eximbank EDigi" },
  { id: "seab", name: "SeABank" },
  { id: "scb", name: "SCB" },
  { id: "abb", name: "ABBank" },
  { id: "nab", name: "Nam A Bank" },
  { id: "ncb", name: "NCB iziMobile" },
  { id: "klb", name: "KienlongBank" },
  { id: "bvb", name: "BAOVIET Bank" },
  { id: "vab", name: "Vietbank" },
  { id: "pvcb", name: "PVcomBank" },
  { id: "sgicb", name: "SaigonBank" },
  { id: "oceanbank", name: "Oceanbank" },
  { id: "timo", name: "Timo (BVBank)" },
  { id: "cake", name: "CAKE by VPBank" },
  { id: "shbvn", name: "Shinhan SOL" },
  { id: "wvn", name: "Woori WON" },
  { id: "cimb", name: "Octo by CIMB" },
  { id: "pbvn", name: "Public Bank" },
  { id: "coopbank", name: "Co-opBank" },
] as const;

export type BankAppId = (typeof BANK_APPS)[number]["id"];

export const bankAppName = (id: string) => BANK_APPS.find((b) => b.id === id)?.name ?? "";

/** Link mở thẳng ứng dụng ngân hàng (iOS / Android). Chưa chọn ngân hàng thì không có link. */
export function bankAppUrl(id: string) {
  return BANK_APPS.some((b) => b.id === id) ? `https://dl.vietqr.io/pay?app=${id}` : "";
}
