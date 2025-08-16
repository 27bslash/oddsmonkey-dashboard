import {
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  Grid2,
  Button,
  Dialog,
  Box,
} from '@mui/material';
import { blue, green, red } from '@mui/material/colors';
import { TotalProps } from '../statTable';
import Graph from '../../graph/graph';
import React, { SetStateAction, useState } from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
type StatTableBodyProps = {
  totals: TotalProps;
  balance: { smarkets: number; betfair: number };
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time';
};
function StatTableBody({ totals, balance, filter }: StatTableBodyProps) {
  const betfairExposure = (
    totals.accurateBalance.betfair.betfair_balance - balance.betfair
  ).toFixed(2);
  const smarketsExposure = (
    totals.accurateBalance.smarkets.smarkets_balance - balance.smarkets
  ).toFixed(2);
  const [open, setOpen] = useState(false);
  return (
    <TableBody>
      <TableRow>
        <TableCell>
          <Typography color={blue['400']} style={{ display: 'grid' }}>
            £
            {(
              balance.smarkets +
              balance.betfair +
              totals.smarketsLoss +
              totals.betfairLoss
            ).toFixed(2)}
          </Typography>
          {totals.accurateBalance && (
            <Box display={'flex'}>
              <Tooltip
                title={
                  <>
                    <Typography>
                      Last updated Time: {totals.accurateBalance.smarkets.time}
                    </Typography>
                    <Typography>
                      Smarkets Balance:
                      <span style={{ marginLeft: '5px', color: green['400'] }}>
                        £
                        {totals.accurateBalance.smarkets.smarkets_balance.toFixed(
                          2,
                        )}
                      </span>
                      <span style={{ marginLeft: '5px', color: red['600'] }}>
                        -£
                        {smarketsExposure}
                      </span>
                    </Typography>
                    <Typography>
                      Betfair Balance:
                      <span style={{ marginLeft: '5px', color: green['400'] }}>
                        £
                        {totals.accurateBalance.betfair.betfair_balance.toFixed(
                          2,
                        )}
                      </span>
                      <span style={{ marginLeft: '5px', color: red['600'] }}>
                        -£
                        {betfairExposure}
                      </span>
                    </Typography>
                  </>
                }
              >
                <Typography
                  className="help-hover"
                  color={green['400']}
                  style={{ display: 'grid' }}
                >
                  £
                  {(
                    totals.accurateBalance.smarkets.smarkets_balance +
                    totals.accurateBalance.betfair.betfair_balance
                  ).toFixed(2)}
                </Typography>
              </Tooltip>
              <TrendingUpIcon
                onClick={() => setOpen((prev) => !prev)}
                color={'success'}
                className="icon"
              />
              <GraphDialog open={open} filter={filter} setOpen={setOpen} />
            </Box>
          )}
        </TableCell>
        <TableCell>
          <Typography color={'gold'} style={{ display: 'grid' }}>
            £{balance.smarkets.toFixed(2)}
            <span style={{ color: red['600'] }}>-£{totals.smarketsLoss}</span>
          </Typography>
        </TableCell>
        <TableCell>
          <Typography color={'gold'} style={{ display: 'grid' }}>
            £{balance.betfair.toFixed(2)}
            <span style={{ color: red['600'] }}>-£{totals.betfairLoss}</span>
          </Typography>
        </TableCell>
        <TableCell width={'100px'}>
          <Grid2 container spacing={1} columns={{ sm: 8, md: 8, lg: 8 }}>
            <Grid2 size={4}>
              <Typography
                textTransform="capitalize"
                color="white"
                marginRight="10px"
              >
                min
              </Typography>
            </Grid2>
            <Grid2 size={4} textAlign={'end'}>
              <Typography color={green['400']}>
                £{totals.minProfit.toFixed(2)}
              </Typography>
            </Grid2>
            <Grid2 size={4} style={{ display: 'flex' }}>
              <Typography
                textTransform="capitalize"
                color="white"
                marginRight="10px"
              >
                avg
              </Typography>
            </Grid2>
            <Grid2 size={4} textAlign={'end'}>
              <Typography color={green['400']}>
                £{totals.totalProfit.toFixed(2)}
              </Typography>
            </Grid2>
            <Grid2 size={4} style={{ display: 'flex' }}>
              <Typography
                textTransform="capitalize"
                color="white"
                marginRight="10px"
              >
                max
              </Typography>
            </Grid2>
            <Grid2 size={4} textAlign={'end'}>
              <Typography color={green['400']}>
                £{totals.maxProfit.toFixed(2)}
              </Typography>
            </Grid2>
          </Grid2>
        </TableCell>
        <TableCell>
          <Tooltip
            title={
              <>
                <Typography>Smarkets: £{totals.smarketsLoss}</Typography>
                <Typography>Betfair: £{totals.betfairLoss}</Typography>
              </>
            }
          >
            <Typography id="total-liability" color={blue['400']}>
              £{totals.totalLiability}
            </Typography>
          </Tooltip>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
export interface GraphDialogProps {
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  filter: 'active' | 'day' | 'week' | 'month' | 'year' | 'all time';
}

function GraphDialog(props: GraphDialogProps) {
  const { setOpen, open, filter } = props;

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      fullWidth={true}
      PaperProps={{
        style: { width: 1300, maxWidth: '90vw' },
      }}
    >
      <Graph filter={filter} />
    </Dialog>
  );
}
export default StatTableBody;
