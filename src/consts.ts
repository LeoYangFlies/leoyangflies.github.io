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

// Carry-On: travel tips and hacks. The key is what you write in a tip's "topic" field.
export const TIPS_TITLE = 'Carry-On';
export const TIPS_DESCRIPTION = 'Tips and hacks picked up over more than half a million kilometers of flying.';
export const TIP_TOPICS = {
  booking: 'Booking',
  seats: 'Seats',
  airports: 'Airports',
  onboard: 'On board',
  jetlag: 'Jet lag',
  packing: 'Packing',
  points: 'Points and miles',
} as const;

export type TipTopic = keyof typeof TIP_TOPICS;
