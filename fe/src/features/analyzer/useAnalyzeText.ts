import { useMutation } from '@tanstack/react-query';
import { analyzeText } from '../../services/api/client';


export const useAnalyzeText = () => {
    return useMutation({
        mutationFn: (text: string) => analyzeText(text),
    });
};
