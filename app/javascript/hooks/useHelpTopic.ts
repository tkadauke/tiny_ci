import { useQuery } from "@tanstack/react-query";

export interface HelpTopic {
  title: string;
  html: string;
}

interface HelpTopicNotFound {
  notFound: true;
}

export type HelpTopicResult = HelpTopic | HelpTopicNotFound;

function apiPathForTopic(topicPath: string): string {
  const encodedPath = topicPath
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  return `/api/help_topics/${encodedPath || "index"}`;
}

export function normalizeHelpTopicPath(topicPath: string | undefined): string {
  const normalized = (topicPath || "index").replace(/^\/+|\/+$/g, "");
  return normalized || "index";
}

export function useHelpTopic(topicPath: string | undefined) {
  const normalizedPath = normalizeHelpTopicPath(topicPath);

  return useQuery<HelpTopicResult>({
    queryKey: ["helpTopic", normalizedPath],
    queryFn: async () => {
      const response = await fetch(apiPathForTopic(normalizedPath), {
        headers: { Accept: "application/json" },
      });

      if (response.status === 404) {
        return { notFound: true };
      }

      if (!response.ok) {
        throw new Error(`Failed to load help topic: ${response.status}`);
      }

      return response.json();
    },
  });
}
