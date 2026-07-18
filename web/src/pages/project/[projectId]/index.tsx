import { type GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { projectId } = context.params as { projectId: string };
  const queryString = context.resolvedUrl.split("?")[1] ?? "";
  const destination = `/project/${projectId}/overview${queryString ? `?${queryString}` : ""}`;
  return {
    redirect: { destination, statusCode: 307 },
  };
};

export default function ProjectIndex() {
  // This page redirects server-side to /overview
  return null;
}
