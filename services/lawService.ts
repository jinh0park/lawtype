import { Difficulty } from "../types";

// --- Interfaces provided by user ---
interface LawArticle {
  number: string;     // 조 번호 (예: 제2조)
  title: string;      // 조 제목 (예: 신의성실)
  content: string;    // 항/호가 통합된 전체 본문
}

interface CivilLawJson {
  법령: {
    조문: {
      조문단위: JoUnit[];
    };
  };
}

interface JoUnit {
  조문번호: string;
  조문제목?: string;
  조문내용: string | string[][];
  조문여부: string;
  항?: JoHang | JoHang[];
}

interface JoHang {
  항내용: string;
  호?: JoHo | JoHo[];
}

interface JoHo {
  호내용: string;
}

// --- Parsing Logic provided by user ---
function parseCivilLawJson(jsonData: CivilLawJson): LawArticle[] {
  const result: LawArticle[] = [];
  const joList = jsonData.법령?.조문?.조문단위;

  if (!joList || !Array.isArray(joList)) return result;

  joList.forEach((jo) => {
    // 1. '조문'인 데이터만 추출
    if (jo.조문여부 !== "조문") return;

    // 2. 삭제된 조문 필터링 (New)
    // 예: "제436조 삭제 <2015.2.3>" 또는 "제100조(제목) 삭제 <...>" 형태 제거
    // '삭제'라는 단어가 있고 뒤에 날짜 괄호(<, [, ()가 오는 패턴 확인
    if (typeof jo.조문내용 === "string" && /삭제\s*[<\[\(]/.test(jo.조문내용)) {
        return;
    }

    let fullText = "";

    // 3. 기본 조문 내용 처리
    if (typeof jo.조문내용 === "string") {
      // Remove patterns like <신설 2011. 3. 7.> or <개정 ...>
      const cleanJoContent = jo.조문내용.replace(/<[^>]+>/g, "").trim();
      fullText += cleanJoContent;
    }

    // 4. 항(Hang) 데이터 처리
    if (jo.항) {
      const hangs = Array.isArray(jo.항) ? jo.항 : [jo.항];
      hangs.forEach((hang) => {
        let hangContent = hang.항내용 || "";
        // Remove angle bracket patterns
        hangContent = hangContent.replace(/<[^>]+>/g, "").trim();

        // 항 내용에서 삭제된 경우도 체크 (드물지만 확인)
        if (/삭제\s*[<\[\(]/.test(hangContent)) return;
        
        if (hangContent) {
            fullText += "\n" + hangContent;
        }

        // 5. 호(Ho) 데이터 처리
        if (hang.호) {
          const hos = Array.isArray(hang.호) ? hang.호 : [hang.호];
          hos.forEach((ho) => {
             let hoContent = ho.호내용 || "";
             // Remove angle bracket patterns
             hoContent = hoContent.replace(/<[^>]+>/g, "").trim();

             // 호 내용에서 삭제된 경우 체크
             if (/삭제\s*[<\[\(]/.test(hoContent)) return;
             
             if (hoContent) {
                fullText += "\n  " + hoContent;
             }
          });
        }
      });
    }

    // 6. Remove parentheses containing Hanja characters (e.g., "(民法)")
    // Matches optional space + ( any-char-sequence containing Hanja any-char-sequence )
    const hanjaRegex = /\s*\([^)]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF][^)]*\)/g;
    const cleanedText = fullText.replace(hanjaRegex, "");

    result.push({
      number: `제${jo.조문번호}조`,
      title: jo.조문제목 || "",
      content: cleanedText.trim()
    });
  });

  return result;
}

// --- Service Implementation ---

// Cache to store fetched articles so we don't spam the API on restart
let cachedArticles: LawArticle[] = [];

export const fetchCivilLawSentences = async (difficulty: Difficulty, count: number = 5): Promise<string[]> => {
  try {
    if (cachedArticles.length === 0) {
      // Fetch from local public/civil.json
      const response = await fetch('civil.json'); // Relative path works with base URL
      
      if (!response.ok) {
        throw new Error(`Local file fetch error: ${response.status}`);
      }
      
      const json = await response.json();
      cachedArticles = parseCivilLawJson(json);
      
      if (cachedArticles.length === 0) {
        throw new Error("Parsed data is empty");
      }
    }

    // Determine the source pool: Only Cache
    let sourcePool: { content: string }[] = cachedArticles;
    
    // Filter by difficulty (Length based)
    let filtered: { content: string }[] = [];
    switch (difficulty) {
      case Difficulty.EASY:
        // Short articles: < 100 characters
        filtered = sourcePool.filter(a => a.content.length > 20 && a.content.length <= 100);
        break;
      case Difficulty.MEDIUM:
        // Medium articles: 100 - 250 characters
        filtered = sourcePool.filter(a => a.content.length > 100 && a.content.length <= 250);
        break;
      case Difficulty.HARD:
        // Long articles: > 250 characters
        filtered = sourcePool.filter(a => a.content.length > 250);
        break;
    }

    // Fallback if filtering is too aggressive - just pick random ones from pool if filtered is empty
    if (filtered.length === 0) {
      console.warn(`No articles found for difficulty ${difficulty}, using random articles from pool.`);
      filtered = sourcePool;
    }

    // Shuffle and pick 'count' items
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    // Format for typing: Replace newlines with spaces to ensure single-flow typing
    return selected.map(article => {
        // Clean up multiple spaces and newlines
        const cleanContent = article.content.replace(/\s+/g, ' ').trim();
        return cleanContent;
    });

  } catch (error) {
    console.error("Law Service Critical Error:", error);
    throw error;
  }
};