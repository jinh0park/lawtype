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
      fullText += jo.조문내용;
    }

    // 4. 항(Hang) 데이터 처리
    if (jo.항) {
      const hangs = Array.isArray(jo.항) ? jo.항 : [jo.항];
      hangs.forEach((hang) => {
        // 항 내용에서 삭제된 경우도 체크 (드물지만 확인)
        if (/삭제\s*[<\[\(]/.test(hang.항내용)) return;
        
        fullText += "\n" + hang.항내용;

        // 5. 호(Ho) 데이터 처리
        if (hang.호) {
          const hos = Array.isArray(hang.호) ? hang.호 : [hang.호];
          hos.forEach((ho) => {
             // 호 내용에서 삭제된 경우 체크
             if (/삭제\s*[<\[\(]/.test(ho.호내용)) return;
             fullText += "\n  " + ho.호내용;
          });
        }
      });
    }

    result.push({
      number: `제${jo.조문번호}조`,
      title: jo.조문제목 || "",
      content: fullText.trim()
    });
  });

  return result;
}

// --- Fallback Data (Expanded) ---
const FALLBACK_ARTICLES = [
  "제1조 (법원) 민사에 관하여 법률에 규정이 없으면 관습법에 의하고 관습법이 없으면 조리에 의한다.",
  "제2조 (신의성실) 권리의 행사와 의무의 이행은 신의에 좇아 성실히 하여야 한다.",
  "제3조 (권리능력의 존속기간) 사람은 생존한 동안 권리와 의무의 주체가 된다.",
  "제4조 (성년) 사람은 19세로 성년에 이른다.",
  "제5조 (미성년자의 능력) 미성년자가 법률행위를 함에는 법정대리인의 동의를 얻어야 한다. 그러나 권리만을 얻거나 의무만을 면하는 행위는 그러하지 아니하다.",
  "제98조 (물건의 정의) 본법에서 물건이라 함은 유체물 및 전기 기타 관리할 수 있는 자연력을 말한다.",
  "제99조 (부동산, 동산) 토지와 그 정착물은 부동산이다. 부동산 이외의 물건은 동산이다.",
  "제103조 (반사회질서의 법률행위) 선량한 풍속 기타 사회질서에 위반한 사항을 내용으로 하는 법률행위는 무효로 한다.",
  "제104조 (불공정한 법률행위) 당사자의 궁박, 경솔 또는 무경험으로 인하여 현저하게 공정을 잃은 법률행위는 무효로 한다.",
  "제109조 (착오로 인한 의사표시) 의사표시는 법률행위의 내용의 중요부분에 착오가 있는 때에는 취소할 수 있다. 그러나 그 착오가 표의자의 중대한 과실로 인한 때에는 취소하지 못한다.",
  "제211조 (소유권의 내용) 소유자는 법률의 범위내에서 그 소유물을 사용, 수익, 처분할 권리가 있다.",
  "제250조 (도품, 유실물에 대한 특례) 전조의 경우에 그 동산이 도품이나 유실물인 때에는 피해자 또는 유실자는 도난 또는 유실한 날로부터 2년내에 그 물건의 반환을 청구할 수 있다.",
  "제390조 (채무불이행과 손해배상) 채무자가 채무의 내용에 좇은 이행을 하지 아니한 때에는 채권자는 손해배상을 청구할 수 있다. 그러나 채무자의 고의나 과실없이 이행할 수 없게 된 때에는 그러하지 아니하다.",
  "제393조 (손해배상의 범위) 채무불이행으로 인한 손해배상은 통상의 손해를 그 한도로 한다. 특별한 사정으로 인한 손해는 채무자가 그 사정을 알았거나 알 수 있었을 때에 한하여 배상의 책임이 있다.",
  "제750조 (불법행위의 내용) 고의 또는 과실로 인한 위법행위로 타인에게 손해를 가한 자는 그 손해를 배상할 책임이 있다.",
  "제751조 (재산 이외의 손해의 배상) 타인의 신체, 자유, 명예를 해하거나 기타 정신상고통을 가한 자는 재산 이외의 손해에 대하여도 배상할 책임이 있다.",
  "제752조 (생명침해로 인한 위자료) 타인의 생명을 해한 자는 피해자의 직계존속, 직계비속 및 배우자에 대하여는 재산상의 손해없는 경우에도 손해배상의 책임이 있다.",
  "제760조 (공동불법행위자의 책임) 수인이 공동의 불법행위로 타인에게 손해를 가한 때에는 연대하여 그 손해를 배상할 책임이 있다."
];

// --- Service Implementation ---

// Cache to store fetched articles so we don't spam the API on restart
let cachedArticles: LawArticle[] = [];

export const fetchCivilLawSentences = async (difficulty: Difficulty, count: number = 5): Promise<string[]> => {
  try {
    if (cachedArticles.length === 0) {
      // Fetch from local public/civil.json
      try {
          const response = await fetch('/civil.json');
          
          if (!response.ok) {
            throw new Error(`Local file fetch error: ${response.status}`);
          }
          
          const json = await response.json();
          cachedArticles = parseCivilLawJson(json);
      } catch (e) {
          console.warn("Local JSON Fetch failed, using fallback data", e);
          // If fetch fails, we will proceed to use fallback data below
      }
    }

    // Determine the source pool: Cache or Fallback
    let sourcePool: { content: string }[] = cachedArticles;
    
    if (cachedArticles.length === 0) {
        // Map fallback strings to object structure for consistent filtering
        sourcePool = FALLBACK_ARTICLES.map(text => ({ content: text }));
    }

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

    // Fallback if filtering is too aggressive
    if (filtered.length === 0) {
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
    // Ultimate fallback if something goes wrong in the logic above
    return FALLBACK_ARTICLES.slice(0, 5);
  }
};