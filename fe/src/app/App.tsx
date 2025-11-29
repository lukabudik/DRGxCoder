import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../pages/home/HomePage';
import { I18nProvider } from '../shared/i18n';

const queryClient = new QueryClient();

function App() {
    return (
        <I18nProvider defaultLocale="cs">
            <QueryClientProvider client={queryClient}>
                <HomePage />
            </QueryClientProvider>
        </I18nProvider>
    );
}

export default App;
