export const A11Y_GUIDELINES = {
  WCAG_2_1: {
    version: '2.1',
    level: 'AA',
    description: 'Web Content Accessibility Guidelines 2.1 Level AA',
  },
  SECTION_508: {
    version: '508',
    description: 'Section 508 of the Rehabilitation Act',
  },
};

export interface AccessibilityIssue {
  element: HTMLElement;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export const accessibilityChecks = {
  hasAltText: (img: HTMLImageElement): AccessibilityIssue | null => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      return {
        element: img,
        rule: 'Image Alt Text',
        message: 'Images must have alt text for screen readers',
        severity: 'error',
      };
    }
    return null;
  },

  buttonHasLabel: (button: HTMLButtonElement): AccessibilityIssue | null => {
    const hasLabel = button.textContent?.trim() || button.getAttribute('aria-label');
    if (!hasLabel) {
      return {
        element: button,
        rule: 'Button Label',
        message: 'Buttons must have accessible text or aria-label',
        severity: 'error',
      };
    }
    return null;
  },

  linkHasLabel: (link: HTMLAnchorElement): AccessibilityIssue | null => {
    const hasLabel = link.textContent?.trim() || link.getAttribute('aria-label');
    if (!hasLabel) {
      return {
        element: link,
        rule: 'Link Label',
        message: 'Links must have accessible text or aria-label',
        severity: 'error',
      };
    }
    return null;
  },

  headingHierarchy: (headings: HTMLHeadingElement[]): AccessibilityIssue[] => {
    const issues: AccessibilityIssue[] = [];
    let previousLevel = 1;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);
      if (level > previousLevel + 1) {
        issues.push({
          element: heading,
          rule: 'Heading Hierarchy',
          message: `Heading jumps from H${previousLevel} to H${level}. Should follow sequential order.`,
          severity: 'warning',
        });
      }
      previousLevel = level;
    });

    return issues;
  },

  contrastRatio: (element: HTMLElement): AccessibilityIssue | null => {
    const color = window.getComputedStyle(element).color;
    const bgColor = window.getComputedStyle(element).backgroundColor;

    if (color === 'rgba(0, 0, 0, 0)' || bgColor === 'rgba(0, 0, 0, 0)') {
      return null;
    }

    // Simplified check - in production, use luminance calculations
    return null;
  },

  hasSkipLink: (): AccessibilityIssue | null => {
    const skipLink = document.querySelector('a[href="#main-content"]');
    if (!skipLink) {
      return {
        element: document.body,
        rule: 'Skip Links',
        message: 'Page should have a skip-to-main-content link for keyboard navigation',
        severity: 'warning',
      };
    }
    return null;
  },

  keyboardNavigable: (element: HTMLElement): AccessibilityIssue | null => {
    const isInteractive =
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.tagName === 'INPUT' ||
      element.getAttribute('role') === 'button' ||
      element.getAttribute('tabindex') !== null;

    if (
      isInteractive &&
      element.getAttribute('tabindex') === '-1' &&
      element.tagName !== 'STYLE' &&
      element.tagName !== 'SCRIPT'
    ) {
      return {
        element,
        rule: 'Keyboard Navigation',
        message: 'Interactive element should be keyboard accessible',
        severity: 'warning',
      };
    }
    return null;
  },
};

export function runAccessibilityAudit(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  document.querySelectorAll('img').forEach((img) => {
    const issue = accessibilityChecks.hasAltText(img);
    if (issue) issues.push(issue);
  });

  document.querySelectorAll('button').forEach((button) => {
    const issue = accessibilityChecks.buttonHasLabel(button);
    if (issue) issues.push(issue);
  });

  document.querySelectorAll('a').forEach((link) => {
    const issue = accessibilityChecks.linkHasLabel(link);
    if (issue) issues.push(issue);
  });

  const headingIssues = accessibilityChecks.headingHierarchy(
    Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
  );
  issues.push(...headingIssues);

  const skipLinkIssue = accessibilityChecks.hasSkipLink();
  if (skipLinkIssue) issues.push(skipLinkIssue);

  return issues;
}
