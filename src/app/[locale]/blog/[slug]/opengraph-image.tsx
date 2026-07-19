import {ImageResponse} from "next/og";
import {SITE_URL} from "@/config/site";
import BlogRepository from "@/domain/blog_repository";

export const alt = "NovelGlide Blog";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

const LABEL = "NovelGlide Blog";
const BACKGROUND = "linear-gradient(135deg, #1c1917 0%, #44403c 100%)";
const ICON_URL = `${SITE_URL}/images/app_icon.png`;

const FONT_FAMILY_BY_LOCALE: Record<string, string> = {
  en: "Noto Sans",
  ja: "Noto Sans JP",
  "zh-tw": "Noto Sans TC",
  "zh-cn": "Noto Sans SC",
};

// Fetch a Google Fonts subset covering exactly `text`, in a Satori-compatible
// format (ttf/otf — Satori cannot read woff2). Returns null on any failure so
// the caller degrades instead of throwing.
async function loadFont(locale: string, text: string): Promise<ArrayBuffer | null> {
  const family = FONT_FAMILY_BY_LOCALE[locale] ?? "Noto Sans";
  const url =
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}` +
    `:wght@700&text=${encodeURIComponent(text)}`;
  try {
    const css = await (await fetch(url)).text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/);
    if (!match) {
      return null;
    }
    return await (await fetch(match[1])).arrayBuffer();
  } catch {
    return null;
  }
}

// Full-bleed card that just shows the post's cover image.
function coverCard(coverUrl: string): ImageResponse {
  return new ImageResponse(
    (
      <div style={{display: "flex", width: "100%", height: "100%", background: BACKGROUND}}>
        <img src={coverUrl} alt="" width={size.width} height={size.height} style={{objectFit: "cover"}}/>
      </div>
    ),
    size,
  );
}

// Icon-only branded card — the text-less fallback (needs no font).
function iconCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
        }}
      >
        <img src={ICON_URL} alt="" width={220} height={220} style={{borderRadius: 52}}/>
      </div>
    ),
    size,
  );
}

type Props = {params: Promise<{locale: string; slug: string}>};

export default async function OpengraphImage({params}: Props): Promise<ImageResponse> {
  try {
    const {locale, slug} = await params;
    const post = await BlogRepository.getPost(slug, locale);

    // A real cover beats a generated card — bake it into our own PNG (which also
    // sidesteps the Notion signed-URL expiry for the OG case).
    if (post?.coverUrl) {
      return coverCard(post.coverUrl);
    }

    const title = post?.title ?? LABEL;
    const font = await loadFont(locale, `${title}${LABEL}`);
    if (!font) {
      return iconCard();
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "80px",
            background: BACKGROUND,
            color: "#fafaf9",
            fontFamily: "Brand",
          }}
        >
          <div style={{display: "flex", alignItems: "center", gap: "20px", fontSize: 34, color: "#d6d3d1"}}>
            <img src={ICON_URL} alt="" width={64} height={64} style={{borderRadius: 16}}/>
            <span>{LABEL}</span>
          </div>
          <div style={{display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.15}}>
            {title}
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [{name: "Brand", data: font, weight: 700, style: "normal"}],
      },
    );
  } catch {
    // Last-resort: a pure gradient — no font, no remote image, cannot fail.
    return new ImageResponse(
      <div style={{display: "flex", width: "100%", height: "100%", background: BACKGROUND}}/>,
      size,
    );
  }
}
