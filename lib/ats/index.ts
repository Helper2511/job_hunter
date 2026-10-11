import { fetchAshby } from "./ashby";
import { fetchGreenhouse } from "./greenhouse";
import { fetchLever } from "./lever";
import { fetchRecruitee } from "./recruitee";
import { fetchSmartRecruiters } from "./smartrecruiters";
import type { AtsType, RawPosting } from "./types";
import { fetchWorkable } from "./workable";
import { fetchWorkday, workdayBoardUrl } from "./workday";

export const ATS_FETCHERS: Record<AtsType, (token: string) => Promise<RawPosting[]>> = {
  greenhouse: fetchGreenhouse,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
  recruitee: fetchRecruitee,
  workable: fetchWorkable,
  workday: fetchWorkday,
};

export const ATS_BOARD_URL: Record<AtsType, (token: string) => string> = {
  greenhouse: (t) => `https://job-boards.greenhouse.io/${t}`,
  lever: (t) => `https://jobs.lever.co/${t}`,
  ashby: (t) => `https://jobs.ashbyhq.com/${t}`,
  smartrecruiters: (t) => `https://careers.smartrecruiters.com/${t}`,
  recruitee: (t) => `https://${t}.recruitee.com`,
  workable: (t) => `https://apply.workable.com/${t}`,
  workday: workdayBoardUrl,
};

export type { AtsType, RawPosting };
