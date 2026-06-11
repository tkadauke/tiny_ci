import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useHelpTopic } from "help_topic_query";

function isHelpTopicNotFound(topic) {
  return Boolean(topic && typeof topic === "object" && topic.notFound);
}

export function HelpTopicPage() {
  const { "*": wildcardPath } = useParams();
  const navigate = useNavigate();
  const { data: topic, isLoading, isError } = useHelpTopic(wildcardPath);

  const handleHelpContentClick = (event) => {
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

    if (!(event.target instanceof Element)) {
      return;
    }

    const link = event.target.closest("a[href]");
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
    return React.createElement("p", null, "Loading help topic...");
  }

  if (isError) {
    return React.createElement("p", null, "Unable to load this help topic.");
  }

  if (!topic || isHelpTopicNotFound(topic)) {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement("h2", null, "Help topic not found"),
      React.createElement("p", null, "The requested help topic could not be found.")
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("h2", null, topic.title),
    React.createElement("div", {
      className: "help-content",
      onClick: handleHelpContentClick,
      dangerouslySetInnerHTML: { __html: topic.html },
    })
  );
}
