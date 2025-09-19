import HttpRepositoryData from "@/data/http_repository_data";

export default class HttpRepository {
    private static data = new HttpRepositoryData();

    static async fetchMarkdown(url: string) {
        return this.data.fetchMarkdown(url);
    }
}