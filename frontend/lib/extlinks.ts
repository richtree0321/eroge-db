// ======================================== // 外部リンクのURL変換ルールをまとめる
// ======================================== // ここからファイル本体

export type ExternalLinkItem = { // 外部リンク1件の型を定義
  site: string; // サイト識別子（例: dlsite）
  value: string; // DBに入っている値（IDやURL断片など）
  url: string | null; // 変換後のURL（不明な場合はnull）
}; // 型定義の終わり

const isHttpUrl = (value: string): boolean => { // 文字列がURLかどうか判定する関数
  return value.startsWith("http://") || value.startsWith("https://"); // http/httpsのどちらかで始まるかを確認
}; // 判定関数の終わり

const buildDmmUrl = (value: string): string => { // DMM用のURLを作る関数
  if (value.startsWith("//")) { // 先頭が // の場合だけ特別に処理
    return `https:${value}`; // https を補って返す
  } // ifブロックの終わり
  return `https://${value}`; // それ以外は https:// を付ける
}; // DMM用関数の終わり

const buildDlsiteUrl = (value: string): string | null => { // DLSite用のURLを作る関数
  if (value.startsWith("RJ")) { // RJから始まる場合
    return `https://www.dlsite.com/maniax/work/=/product_id/${value}.html`; // RJはmaniax扱いでURL化
  } // ifブロックの終わり
  if (value.startsWith("VJ")) { // VJから始まる場合
    return `https://www.dlsite.com/pro/work/=/product_id/${value}.html`; // VJはpro扱いでURL化
  } // ifブロックの終わり
  return null; // それ以外は不明としてnull
}; // DLSite用関数の終わり

const buildDigiketUrl = (value: string): string | null => { // DiGiket用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  const padded = value.padStart(7, "0"); // 7桁になるように先頭を0埋め
  return `https://www.digiket.com/work/show/_data/ID=ITM${padded}/`; // ITM+7桁の形式でURL化
}; // DiGiket用関数の終わり

const buildGyuttoUrl = (value: string): string | null => { // Gyutto用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `http://gyutto.com/i/item${value}?select_uaflag=1`; // 例に合わせたURLを作成
}; // Gyutto用関数の終わり

const buildGetchuUrl = (value: string): string | null => { // Getchu用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://www.getchu.com/soft.phtml?id=${value}`; // idパラメータでURL化
}; // Getchu用関数の終わり

const buildEgsUrl = (value: string): string | null => { // EGS用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/game.php?game=${value}`; // 例に合わせたURLを作成
}; // EGS用関数の終わり

const buildSteamUrl = (value: string): string | null => { // Steam用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://store.steampowered.com/app/${value}/`; // Steamのappページ形式
}; // Steam用関数の終わり

const buildPixivUrl = (value: string): string | null => { // pixiv用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://www.pixiv.net/users/${value}`; // pixivのユーザーページ形式
}; // pixiv用関数の終わり

const buildBoothUrl = (value: string): string | null => { // BOOTH用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://booth.pm/ja/items/${value}`; // BOOTHのアイテムページ形式
}; // BOOTH用関数の終わり

const buildTwitterUrl = (value: string): string | null => { // X(旧Twitter)用のURLを作る関数
  const trimmed = value.replace(/^@/, ""); // 先頭の@があれば外す
  if (trimmed.length === 0) { // 空文字になったら不正と判断
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://x.com/${trimmed}`; // XのプロフィールURL形式
}; // X用関数の終わり

const buildItchUrl = (value: string): string | null => { // itch.ioの作品URLを作る関数
  if (!value.includes("/")) { // user/game 形式でない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  const [user, game] = value.split("/"); // user と game を分解
  if (!user || !game) { // 片方でも空なら不正と判断
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://${user}.itch.io/${game}`; // itch.ioのURL形式
}; // itch.io用関数の終わり

const buildItchDevUrl = (value: string): string | null => { // itch.ioの開発者URLを作る関数
  if (value.length === 0) { // 空文字なら不正と判断
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://${value}.itch.io/`; // 開発者のトップページ形式
}; // itch.io開発者用関数の終わり

const buildYoutubeUrl = (value: string): string | null => { // YouTube用のURLを作る関数
  if (value.length === 0) { // 空文字なら不正と判断
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://www.youtube.com/@${value}`; // ハンドル形式でURL化
}; // YouTube用関数の終わり

const buildWikidataUrl = (value: string): string | null => { // Wikidata用のURLを作る関数
  if (!/^[0-9]+$/.test(value)) { // 数字だけでない場合は対象外
    return null; // 変換できないのでnull
  } // ifブロックの終わり
  return `https://www.wikidata.org/wiki/Q${value}`; // Q番号としてURL化
}; // Wikidata用関数の終わり

export const buildExternalUrl = (site: string, value: string): string | null => { // サイト別にURLを組み立てる関数
  if (isHttpUrl(value)) { // すでにURLの場合
    return value; // そのまま返す
  } // ifブロックの終わり
  switch (site) { // siteごとの処理に分岐
    case "dlsite": // DLSite用の分岐
      return buildDlsiteUrl(value); // DLSite用関数でURL化
    case "dmm": // DMM用の分岐
      return buildDmmUrl(value); // DMM用関数でURL化
    case "website": // 公式サイト用の分岐
      return value; // そのまま返す（URLのはず）
    case "steam": // Steam用の分岐
      return buildSteamUrl(value); // Steam用関数でURL化
    case "pixiv": // pixiv用の分岐
      return buildPixivUrl(value); // pixiv用関数でURL化
    case "booth": // BOOTH用の分岐
      return buildBoothUrl(value); // BOOTH用関数でURL化
    case "twitter": // X(旧Twitter)用の分岐
      return buildTwitterUrl(value); // X用関数でURL化
    case "getchu": // Getchu用の分岐
      return buildGetchuUrl(value); // Getchu用関数でURL化
    case "gyutto": // Gyutto用の分岐
      return buildGyuttoUrl(value); // Gyutto用関数でURL化
    case "digiket": // DiGiket用の分岐
      return buildDigiketUrl(value); // DiGiket用関数でURL化
    case "egs": // EGS用の分岐
      return buildEgsUrl(value); // EGS用関数でURL化
    case "itch": // itch.io作品用の分岐
      return buildItchUrl(value); // itch.io作品用関数でURL化
    case "itch_dev": // itch.io開発者用の分岐
      return buildItchDevUrl(value); // itch.io開発者用関数でURL化
    case "youtube": // YouTube用の分岐
      return buildYoutubeUrl(value); // YouTube用関数でURL化
    case "wikidata": // Wikidata用の分岐
      return buildWikidataUrl(value); // Wikidata用関数でURL化
    default: // 未対応サイトの分岐
      return null; // 未対応はnullを返す
  } // switchの終わり
}; // URL組み立て関数の終わり
