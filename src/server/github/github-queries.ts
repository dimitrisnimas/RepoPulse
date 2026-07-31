export const PROFILE_QUERY = `
  query RepoPulseProfile($login: String!, $after: String) {
    user(login: $login) {
      login name avatarUrl(size: 160) bio company location websiteUrl createdAt
      status { message emoji }
      followers { totalCount }
      following { totalCount }
      gists(privacy: PUBLIC) { totalCount }
      repositories(first: 100, after: $after, privacy: PUBLIC, ownerAffiliations: OWNER, isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          stargazerCount forkCount isArchived
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
          stargazerCount forkCount isArchived
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name color } }
          }
        }
      }
    }
  }
`;

export const CONTRIBUTIONS_QUERY = `
  query RepoPulseContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel weekday } }
        }
      }
    }
  }
`;
export const REPOSITORY_QUERY=`
 query RepoPulseRepository($owner:String!,$name:String!){repository(owner:$owner,name:$name){name owner{login} description url homepageUrl primaryLanguage{name color} stargazerCount forkCount issues(states:OPEN){totalCount} watchers{totalCount} licenseInfo{name} repositoryTopics(first:10){nodes{topic{name}}} isArchived isFork isTemplate visibility pushedAt createdAt defaultBranchRef{name}}}
`;
export const PINNED_QUERY=`
 query RepoPulsePinned($login:String!,$first:Int!){user(login:$login){login pinnedItems(first:$first,types:[REPOSITORY]){nodes{__typename ... on Repository{name owner{login} description url primaryLanguage{name color} stargazerCount forkCount isArchived}}}}}
`;
