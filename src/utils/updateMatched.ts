import { Matched } from "../../types";

const updateMatched = (backMatched: Matched[], layMatched: Matched[]) => {
  const longestMatched =
    backMatched.length > layMatched.length ? backMatched : layMatched;
  for (let i = 0; i < longestMatched.length; i++) {
    if (backMatched[i] && !layMatched[i]) {
      // Back matched exists but lay matched does not, create a new lay matched object
      layMatched.push({
        odds: [1],
        staked: [0],
        matched: [0],
        bet_matched_time: backMatched[i].bet_matched_time,
        type: backMatched[i].type || 'standard',
      });
    } else if (!backMatched[i] && layMatched[i]) {
      // Lay matched exists but back matched does not, create a new back matched object
      backMatched.push({
        odds: [1],
        staked: [0],
        matched: [0],
        bet_matched_time: layMatched[i].bet_matched_time,
        type: layMatched[i].type || 'standard'
      });
    }
  }
};


export default updateMatched;