export type NominationRuleProps = {
  label: string;
  checked: boolean;
};

export const NominationRule: React.FC<NominationRuleProps> = ({
  label,
  checked,
}) => {
  return (
    <div>
      <label>
        <input type="checkbox" checked={checked} />
        {label}
      </label>
    </div>
  );
};
