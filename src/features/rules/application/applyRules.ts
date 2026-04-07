export interface RegexRule {
  name: string;
  pattern: string;
  tag: string;
}

export interface ParsedInvoiceLike {
  invoiceNumber: string;
  buyerName: string;
  sellerName: string;
  tags: string[];
}

export function applyRules(
  invoice: ParsedInvoiceLike,
  rules: RegexRule[],
  previousAutoAppliedTags: string[] = [],
): ParsedInvoiceLike {
  const previousAutoAppliedTagSet = new Set(previousAutoAppliedTags);
  const tags = invoice.tags.filter((tag) => !previousAutoAppliedTagSet.has(tag));
  const haystack = [invoice.invoiceNumber, invoice.buyerName, invoice.sellerName];

  for (const rule of rules) {
    let matcher: RegExp;

    try {
      matcher = new RegExp(rule.pattern);
    } catch {
      continue;
    }

    if (haystack.some((value) => matcher.test(value)) && !tags.includes(rule.tag)) {
      tags.push(rule.tag);
    }
  }

  return {
    ...invoice,
    tags,
  };
}
