export function defaultCompanyNotes(company: {
  name: string;
  domain: string | null;
  careersUrl: string | null;
  industry: string | null;
  companyType: string;
  companyTypeReason: string | null;
}): string {
  const lines = [
    `${company.name}${company.industry ? ` · ${company.industry}` : ""}`,
    company.companyTypeReason ? `What they do: ${company.companyTypeReason}` : "What they do: ",
    company.domain ? `Website: https://${company.domain}` : null,
    company.careersUrl ? `Careers page: ${company.careersUrl}` : null,
    `Recent news: https://news.google.com/search?q=${encodeURIComponent(company.name)}`,
    "",
    "Products:",
    "Notes:",
  ];
  return lines.filter((l) => l !== null).join("\n");
}
