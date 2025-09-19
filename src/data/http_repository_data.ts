export default class HttpRepositoryData {
    async fetchMarkdown(url: string) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch markdown from ${url}: ${response.statusText}`);
        }

        return await response.text();
    }
}