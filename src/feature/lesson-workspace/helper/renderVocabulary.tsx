import { VocabularyWord } from "../component/VocabularyWord";

export function renderVocabulary(
    content: string,
    vocabulary: Vocabulary[]
) {
    let result: React.ReactNode[] = [content];

    vocabulary.forEach((item) => {
        result = result.flatMap((part) => {
            if (typeof part !== "string") return [part];

            return part.split(new RegExp(`(${item.word})`, "gi"))
                .map((text, index) => {

                    if (text.toLowerCase() === item.word.toLowerCase()) {

                        return (
                            <VocabularyWord
                                key={`${item.word}-${index}`}
                                {...item}
                            />
                        );

                    }

                    return text;

                });
        });
    });

    return result;
}