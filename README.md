# Cambridge Gliding Centre Annual Trophies

This is a next.js / Raect app with a backend API is tries to read flight
information for a given gliding season from the [BGA
ladder](https://www.bgaladder.net/), score flights based on the various CGC
trophy rules, and render the trophy winners.

# Caveats

This is all automatic, and based on the data provided by the BGA Ladder.
Therefore the software will not always give the correct results. Issues that
we've so far run into:

- A pilot changed clubs. They updated their profile on the BGA Ladder, which
  then applied to all their past flights as well. Therefore they no longer show
  up in the CGC flights and their past trophy wins no longer show up on this app
  either.
- Some trophies are aimed at novice pilots. They have criteria like "for
  novices" or "hasn't flown a 300km/500km/... flight before the seasons starts"
  attached to them. The BGA Ladder does not know if a pilot is a novice, or if
  they have a gold or diamond badge or not. As a result a pilot show by the app
  as winning (or having won) a given trophy might not be eligible for that
  trophy.
- Some trophies are restricted to eg "up to 3 turnpoints" and the scoring
  algorithm implements this rule without exceptions. But some times more
  turnpoints might be acceptable, eg a pilot added turnpoint to their task as a
  navigational aid to avoid airspace, and the algorithm excluded them from the
  trophy (they were awarded the trophy in the end).
- Not all the flights that should be considered for a trophy are uploaded to the
  BGA Ladder, and those flights will clearly not show up in the results.

These are just a few complications that we run into when trying to automate
awarding trophies.

Related to invalid flights: we show only the best qualifying flight for a given
pilot for each trophy. That means that if that flight is invalid for some
reason, we would not show their next best, valid flight in the results. This
probably won't cause issue in practise, but might still be surprising / annoying
to users.

I think the solution will be to:

1. Explicitly state the historical winners. This way we avoid losing winners if
   they or their flight vanishes from the BGA Ladder export, and we can override
   the algorithm and its idiosyncrasies.
2. Implement trophy-specific pilot and flight block lists. This would avoid
   non-eligible pilots from showing up in the results (eg exclude gold pilots),
   and would also address the issue of showing only one flight per pilot in the
   results.
