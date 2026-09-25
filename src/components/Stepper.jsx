/**
 * Stepper component — shows the 3-step workflow progress
 */

function Stepper({ steps, currentStep }) {
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <div key={index} className="stepper__step">
          <div
            className={`stepper__circle ${
              index < currentStep
                ? 'stepper__circle--done'
                : index === currentStep
                ? 'stepper__circle--active'
                : ''
            }`}
          >
            {index < currentStep ? '✓' : index + 1}
          </div>
          <span
            className={`stepper__label ${
              index <= currentStep ? 'stepper__label--active' : ''
            }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <span
              className={`stepper__connector ${
                index < currentStep ? 'stepper__connector--done' : ''
              }`}
            ></span>
          )}
        </div>
      ))}
    </div>
  );
}

export default Stepper;
