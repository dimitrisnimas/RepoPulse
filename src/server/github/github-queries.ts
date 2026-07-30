export const PROFILE_QUERY = `
  query RepoPulseProfile($login: String!, $after: String) {
    user(login: $login) {
      login name avatarUrl(size: 160) bio
      followers { totalCount }
      following { totalCount }
      gists(privacy: PUBLIC) { totalCount }
      repositories(first: 100, after: $after, privacy: PUBLIC, ownerAffiliations: OWNER, isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          stargazerCount forkCount
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name color } }
          }
        }
      }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar { totalContributions }
      }
    }
  }
`;

export const REPOSITORIES_QUERY = `
  query RepoPulseRepositories($login: String!, $after: String!) {
    user(login: $login) {
      repositories(first: 100, after: $after, privacy: PUBLIC, ownerAffiliations: OWNER, isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          stargazerCount forkCount
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name color } }
          }
        }
      }
    }
  }
`;
