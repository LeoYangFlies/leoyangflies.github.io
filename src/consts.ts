// Site-wide settings. Change these to make the blog yours.

export const SITE_TITLE = 'Leo Flies';
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
  flight: 'Flights',
  airport: 'Airports',
  lounge: 'Lounges',
  destination: 'Destinations',
} as const;

export type Category = keyof typeof CATEGORIES;

export const CABINS = ['Economy', 'Premium Economy', 'Business', 'First'] as const;
