
import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { generateCurvePoints } from '../utils/curves.js';
import { maxTimeMonths } from '../App.js';

const ANCHOR_MONTHS = [3, 12, 36];



// const generateData = (parameters) => {
//   const points = [];
//   const successPoints = [
//     parameters.successanch1 / 100,
//     parameters.successanch2 / 100,
//     parameters.successanch3 / 100,
//   ];

//   for (let i = 0; i <= 100; i++) {
//     const x = i / 100;
//     // Use log scale from 0.1 months to 60 months (5 years)
//     const time = Math.exp(
//       Math.log(0.1) + x * (Math.log(maxTimeMonths) - Math.log(0.1))
//     );

//     // Calculate success probability using Fritsch-Carlson interpolation
//     const successProb = fitCurveWithFritschCarlson(
//       time,
//       [0, ...successPoints],
//       [Math.log(0.1), ...ANCHOR_MONTHS.map(x => Math.log(x))]
//     );

//     points.push({
//       time,
//       successProbability: successProb
//     });
//   }

//   console.log("points", points)
//   return points;
// };

const SuccessGivenEffort = ({ onChange, data, readOnly, title = 'Success Probability Parameters', hideLabels = false, initialValues, color = '#2ecc71', baselineValues, preMitigationValues }) => {
  // Values shown in the input fields
  const [inputValues, setInputValues] = useState(initialValues || {
    successanch1: 0.1,
    successanch2: 3,
    successanch3: 10,
  });

  // Values used for the chart and calculations
  const [submittedValues, setSubmittedValues] = useState(initialValues || {
    successanch1: 0.1,
    successanch2: 3,
    successanch3: 10,
  });

  // Initialize data on mount
  useEffect(() => {
    if (!readOnly && onChange) {
      onChange(submittedValues);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (key, value) => {
    setInputValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleParameterChange = (key, value) => {
    const newParams = {
      ...submittedValues,
      [key]: value
    };
    setSubmittedValues(newParams);
    if (onChange) onChange(newParams);
  };

  const chartData = useMemo(() => {
    if (data) return data;
    return generateCurvePoints(submittedValues);
  }, [data, submittedValues]);

  // Calculate max y-value from both curves
  const maxY = useMemo(() => {
    const baselineMax = baselineValues ? generateCurvePoints(baselineValues).reduce((max, point) => Math.max(max, point.successProbability), 0) : 0;
    const preMitigationMax = preMitigationValues ? generateCurvePoints(preMitigationValues).reduce((max, point) => Math.max(max, point.successProbability), 0) : 0;
    const currentMax = data ? data.reduce((max, point) => Math.max(max, point.successProbability), 0) : 0;
    return Math.max(0.2, baselineMax, preMitigationMax, currentMax);
  }, [baselineValues, preMitigationValues, data]);

  return (
    <div style={{ width: "100%" }}>
      {!readOnly && (
        <>
          <h4 style={{ textAlign: "center", marginBottom: "20px" }}>
            {title}
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {ANCHOR_MONTHS.map((month, index) => (
              <div key={month}>
                <label>Success at {month} months (%):</label>
                <input
                  type="number"
                  value={inputValues[`successanch${index + 1}`]}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                    handleInputChange(`successanch${index + 1}`, value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      handleParameterChange(`successanch${index + 1}`, value);
                    }
                  }}
                  style={{ width: "80px", marginLeft: "10px" }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        Success Probability
      </h3>
      <LineChart
        width={400}
        height={350}
        margin={{ top: 5, right: 50, left: 50, bottom: 25 }}
        data={chartData}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          scale="log"
          domain={[0.1, maxTimeMonths]}
          type="number"
          ticks={[0.1, 1, 3, 6, 12, 24, 36, maxTimeMonths]}
          label={{
            value: "Months (log scale)",
            position: "bottom",
            offset: 20,
          }}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <YAxis
          domain={[0, maxY]}
          tickFormatter={(value) => Number(value.toPrecision(2))}
          label={{
            value: "Success Probability",
            angle: -90,
            position: "center",
            dx: -35,
          }}
        />
        <Tooltip
          formatter={(value, name) => [typeof value === 'number' ? value.toFixed(4) : value, name]}
          labelFormatter={(value) =>
            `${typeof value === 'number' ? value.toFixed(1) : value} months of effort`
          }
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          wrapperStyle={{
            paddingTop: "10px",
            bottom: -10,
          }}
        />
        <Line
          type="monotone"
          dataKey="successProbability"
          stroke={color}
          name="Success Probability"
          dot={false}
        />
      </LineChart>
    </div>
  );
};

export default SuccessGivenEffort;