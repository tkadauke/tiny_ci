import React, { MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useHelpTopic } from "../../hooks/useHelpTopic";

function isHelpTopicNotFound(topic: unknown): topic is { notFound: true } {
  return Boolean(topic && typeof topic === "object" && "notFound" in topic);
}

export function HelpTopicPage() {
  const { "*": wildcardPath } = useParams();
  const navigate = useNavigate();
  const { data: topic, isLoading, isError } = useHelpTopic(wildcardPath);

  const handleHelpContentClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link || link.target || link.hasAttribute("download")) {
      return;
    }

    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/help_topics")) {
      return;
    }

    event.preventDefault();
    navigate(`${url.pathname}${url.search}${url.hash}`);
  };

  if (isLoading) {
    return <p>Loading help topic...</p>;
  }

  if (isError) {
    return <p>Unable to load this help topic.</p>;
  }

  if (!topic || isHelpTopicNotFound(topic)) {
    return (
      <>
        <h2>Help topic not found</h2>
        <p>The requested help topic could not be found.</p>
      </>
    );
  }

  return (
    <>
      <h2>{topic.title}</h2>
      <div
        className="help-content"
        onClick={handleHelpContentClick}
        dangerouslySetInnerHTML={{ __html: topic.html }}
      />
    </>
  );
}
