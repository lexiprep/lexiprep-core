/**
 * Basic English function words — articles, prepositions, pronouns, auxiliaries,
 * conjunctions and the most common determiners. These carry little learning
 * value for intermediate/advanced readers, so lexiprep can filter them out
 * ("the", "a", "on", "this" should never waste the user's review time).
 *
 * Deliberately conservative: it targets grammatical function words, not common
 * content words a learner might still want (e.g. "time", "people", "first").
 */
const WORDS = [
  // articles
  "a", "an", "the",
  // pronouns
  "i", "you", "he", "she", "it", "we", "they",
  "me", "him", "her", "us", "them",
  "my", "your", "yours", "his", "hers", "its", "our", "ours", "their", "theirs", "mine",
  "myself", "yourself", "yourselves", "himself", "herself", "itself", "ourselves", "themselves",
  "this", "that", "these", "those",
  "who", "whom", "whose", "which", "what",
  "anyone", "anything", "everyone", "everything", "someone", "something", "nobody", "nothing", "none",
  // be / have / do
  "am", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "having",
  "do", "does", "did", "doing",
  // modals
  "will", "would", "shall", "should", "can", "could", "may", "might", "must", "ought",
  // contraction fragments (kept whole by the tokenizer, but harmless as a safety net)
  "n't", "'s", "'re", "'ve", "'ll", "'d", "'m",
  // common contractions
  "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't",
  "haven't", "hasn't", "hadn't", "won't", "wouldn't", "can't", "couldn't",
  "shouldn't", "mustn't", "i'm", "i've", "i'll", "i'd", "you're", "you've",
  "it's", "that's", "there's", "here's", "let's", "we're", "they're",
  // prepositions
  "about", "above", "across", "after", "against", "along", "among", "around",
  "at", "before", "behind", "below", "beneath", "beside", "between", "beyond",
  "by", "down", "during", "for", "from", "in", "inside", "into", "near", "of",
  "off", "on", "onto", "out", "outside", "over", "past", "since", "through",
  "throughout", "to", "toward", "towards", "under", "underneath", "until",
  "unto", "up", "upon", "with", "within", "without",
  // conjunctions
  "and", "or", "but", "nor", "so", "yet", "for", "if", "then", "than",
  "because", "as", "while", "although", "though", "unless", "whereas",
  "whether", "either", "neither", "both",
  // determiners / quantifiers
  "all", "any", "each", "every", "few", "more", "most", "much", "many",
  "no", "some", "such", "other", "another", "same", "own", "only", "several",
  "enough", "not", "very",
  // common adverbs / particles / fillers
  "here", "there", "where", "when", "why", "how", "again", "once", "also",
  "just", "too", "ever", "even", "still", "well", "yes", "no", "ok",
] as const;

export const ENGLISH_STOPWORDS: ReadonlySet<string> = new Set(WORDS);
