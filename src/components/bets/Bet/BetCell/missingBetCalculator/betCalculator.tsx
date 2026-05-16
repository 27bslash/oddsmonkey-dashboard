import { Box } from '@mui/material';
import { BData } from '../../../../../../types';
import CalculatorSection from './calculatorSection';
import ProfitTable from './profitTable/profitTable';
import { useBetCalculator } from './useBetCalculator';

const BetCalculator = ({
  data,
  setShowBetCalc,
}: {
  data: BData;
  setShowBetCalc: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const {
    obj,
    betCalculationParams,
    missingBet,
    backTotal,
    layTotal,
    backLiabilityTotal,
    layLiabilityTotal,
    update,
    setValueObj,
    setUpdate,
    setMissingBet,
  } = useBetCalculator(data);

  if (!obj) return null;

  return (
    <Box
      className="bet-calculator"
      display={'flex'}
      flexDirection={'column'}
      width={'500px'}
    >
      <CalculatorSection
        total={backTotal}
        liability={backLiabilityTotal}
        type="back"
        valueObj={betCalculationParams}
        data={data}
        link={data.bet_info.bookie_link}
        updateValue={setValueObj}
        setUpdate={setUpdate}
        update={update}
        missingBet={missingBet!}
        setMissingBet={setMissingBet}
      ></CalculatorSection>
      <CalculatorSection
        total={layTotal}
        liability={layLiabilityTotal}
        type="lay"
        data={data}
        link={data.bet_info.exchange_link}
        valueObj={betCalculationParams}
        updateValue={setValueObj}
        setUpdate={setUpdate}
        update={update}
        missingBet={missingBet}
        setMissingBet={setMissingBet}
      ></CalculatorSection>

      <ProfitTable
        data={data}
        backLiability={backLiabilityTotal}
        backTotal={backTotal}
        layLiability={layLiabilityTotal}
        layTotal={layTotal}
      ></ProfitTable>
    </Box>
  );
};

export default BetCalculator;
