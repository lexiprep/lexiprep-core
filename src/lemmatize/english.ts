import lemmatizer from "wink-lemmatizer";

/**
 * Best-effort base form (lemma) of an English surface word — e.g. `men` → `man`,
 * `running` → `run`, `happiest` → `happy`, `better` → `good`. Rule-based via
 * wink-lemmatizer (no model, deterministic).
 *
 * Tokens aren't part-of-speech tagged at this stage, so we try the verb, then noun,
 * then adjective reduction and take the first that changes the word. This is correct
 * for the overwhelming majority of inflections. Genuinely ambiguous forms (e.g.
 * `leaves` → leave vs. leaf, `saw` → see vs. saw) resolve to a single reading — a
 * POS-aware lemmatizer could replace this later without changing the signature.
 */
export function lemmatize(word: string): string {
  const verb = lemmatizer.verb(word);
  if (verb !== word) return verb;
  const noun = lemmatizer.noun(word);
  if (noun !== word) return noun;
  const adjective = lemmatizer.adjective(word);
  if (adjective !== word) return adjective;
  return word;
}
