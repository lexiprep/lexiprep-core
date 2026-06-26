// wink-lemmatizer ships no type declarations; this is the minimal surface we use.
declare module "wink-lemmatizer" {
  const lemmatizer: {
    noun(word: string): string;
    verb(word: string): string;
    adjective(word: string): string;
  };
  export default lemmatizer;
}
