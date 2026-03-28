import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostPage from "@/components/blog/BlogPostPage";
import StructuredData from "@/components/seo/StructuredData";
import { blogPosts, getBlogPostBySlug, getBlogPostPath } from "@/lib/blog";
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createMarketingMetadata,
  createOrganizationSchema,
  createSoftwareApplicationSchema,
  createWebPageSchema,
  createWebSiteSchema,
  siteConfig,
} from "@/lib/seo";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  const path = getBlogPostPath(post.slug);
  const baseMetadata = createMarketingMetadata({
    title: post.title,
    description: post.description,
    path,
    keywords: [post.keyword, ...post.keywords],
  });

  return {
    ...baseMetadata,
    title: {
      absolute: post.title,
    },
    category: post.category,
    openGraph: {
      ...baseMetadata.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.publishedAt,
      authors: [siteConfig.name],
      tags: [post.keyword, ...post.keywords.slice(0, 2)],
    },
  };
}

export default async function BlogPostRoute({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const path = getBlogPostPath(post.slug);

  return (
    <>
      <StructuredData
        data={[
          createOrganizationSchema(),
          createWebSiteSchema(),
          createSoftwareApplicationSchema(),
          createWebPageSchema({
            name: post.title,
            path,
            description: post.description,
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.heading, path },
          ]),
          createArticleSchema({
            headline: post.title,
            description: post.description,
            path,
            datePublished: post.publishedAt,
            keywords: [post.keyword, ...post.keywords],
          }),
        ]}
      />
      <BlogPostPage post={post} />
    </>
  );
}
