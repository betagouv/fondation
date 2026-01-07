import type { DetailedMemberDto } from '@api/types';
import { GradeEnum } from '@/types/enums.types';
import React from 'react';

const GRADES = Object.values(GradeEnum);

export function DetailsMemberStats({ stats }: { stats: DetailedMemberDto['stats'] }) {
  const map = React.useMemo(
    () =>
      stats.reduce((m, stat) => {
        const mapPerYear = m.get(stat.year) ?? new Map(GRADES.map((g) => [g, 0] as const));
        mapPerYear.set(stat.targetedGrade, stat.count);
        m.set(stat.year, mapPerYear);

        return m;
      }, new Map<number, Map<GradeEnum, number>>()),
    [stats]
  );

  return (
    <>
      {[...map.entries()]
        .sort((a, b) => b[0] - a[0] /* desc by year */)
        .map(([year, stats]) => (
          <div className="fr-table" key={`member_details_stat_${year}`}>
            <div className="fr-table__wrapper">
              <div className="fr-table__container">
                <div className="fr-table__content">
                  <table>
                    <caption>
                      <h4>Année {year}</h4>
                    </caption>
                    <thead>
                      <tr>
                        <th className="fr-cell--fixed w-32" role="columnheader">
                          Grade
                        </th>
                        <th>Nb. de dossiers affectés</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...stats.entries()].map(([grade, count]) => (
                        <tr key={`member_details_stat_${year}_${grade}`}>
                          <th className="fr-cell--fixed" scope="row">
                            Grade {GradeEnum[grade]}
                          </th>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
    </>
  );
}
