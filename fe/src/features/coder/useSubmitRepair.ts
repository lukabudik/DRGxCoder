import { useMutation } from '@tanstack/react-query';
import { submitCoderRepair } from '../../services/api/client';
import type { CoderCaseData } from '../../core/types';

export const useSubmitRepair = () => {
    return useMutation({
        mutationFn: (payload: CoderCaseData) => submitCoderRepair(payload),
    });
};
