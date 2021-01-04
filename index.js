const core = require('@actions/core');
const github = require('@actions/github');
const token = core.getInput('token');
const issues = core.getInput('issues');
const fromColumn = core.getInput('from_column');
const toColumn = core.getInput('to_column');
const repoOwner = github.context.repo.owner;
const repo = github.context.repo.repo;
const octokit = github.getOctokit(token);

async function main() {
  const issuesAry = issues.split(',');
  var movedIssues = [];
  console.log(issuesAry);

  // Get all cards in the FROM column
  var projectCards = [];
  var done = false;
  for (var page = 0; !done; page++) {
    // Get all cards on the page
    const cards = await octokit.projects.listCards({
      column_id: fromColumn,
      per_page: 100,
      page: page
    });
    console.log(cards);
    for (var i = 0; cards.data && i < cards.data.length; i++) {
      const card = cards.data[i];
      projectCards.push(card);
    }

    if (!cards.data || cards.data.length < 100) {
      done = true;
    }
  }

  // Check each card in the FROM column to see if it's in the list of issues
  // that we want to move.
  console.log(projectCards);
  for (var i = 0; i < projectCards.length; i++) {
    const card = projectCards[i];

    // Get the issue number
    const matches = card.content_url.match(/\/issues\/(\d+)/);
    if (!matches) {
      console.log(`Couldn't match regexp to '${card.content_url}'.`);
      return true;
    }
    const issueNumber = matches[1];
    console.log(`issueNumber=${issueNumber}`);

    // Check if it's in the list of issues
    for (var j = 0; j < issuesAry.length; j++) {
      const issue = issuesAry[j];
      if (issue === issueNumber) {
        ////////////////////
        // Move the issue //
        ////////////////////
        await octokit.projects.moveCard({
          card_id: card.id,
          position: 'top',
          column_id: parseInt(toColumn)
        });
        movedIssues.push(issueNumber);
      }
    }
  }

  core.setOutput('moved_issues', movedIssues.join(','));
}

main();
