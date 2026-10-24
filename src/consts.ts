// Site-wide settings. Change these to make the blog yours.

export const SITE_TITLE = 'Postmarked';
export const SITE_DESCRIPTION =
  'Honest flight reviews from a student commuting between New York and Shanghai, and wherever else I end up.';
export const AUTHOR = 'Leo Yang';

// Leave a link empty ('') to hide it from the footer.
export const SOCIAL = {
  instagram: '',
  email: '',
};

// The kinds of review the blog supports. The key is what you write in a post's
// "category" field; the label is what readers see.
export const CATEGORIES = {
  trip: 'Trip notes',
  stay: 'Stays',
  food: 'Food & drink',
  sight: 'Sights',
  transport: 'Getting around',
} as const;

export type Category = keyof typeof CATEGORIES;
