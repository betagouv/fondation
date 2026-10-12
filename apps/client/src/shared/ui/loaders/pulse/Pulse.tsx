import './Pulse.css';

export function Pulse(props: { size?: string }) {
  const size = props.size ?? '64px';

  return (
    <div className="loader pulse" title="Chargement" style={{ '--loader-size': size } as React.CSSProperties}>
      <div />
      <div />
    </div>
  );
}
