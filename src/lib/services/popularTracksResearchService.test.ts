import { describe, expect, it } from 'vitest'
import { parseKworbChartHtml } from './popularTracksResearchService'

describe('parseKworbChartHtml', () => {
  it('extracts artist and title from kworb daily chart rows', () => {
    const html = `
      <table id="spotifydaily">
        <tr><td class="np">1</td>
        <td class="text mp"><div><a href="../artist/a.html">Eden Hason</a> - <a href="../track/t.html">איך שהיא רוקדת</a> (w/ <a href="../artist/b.html">Ofek Adanek</a>)</div></td>
        </tr>
        <tr><td class="np">2</td>
        <td class="text mp"><div><a href="../artist/c.html">Osher Cohen</a> - <a href="../track/u.html">כולם גנבים</a></div></td>
        </tr>
      </table>
    `

    expect(parseKworbChartHtml(html, 10)).toEqual([
      { title: 'איך שהיא רוקדת', artist: 'Eden Hason' },
      { title: 'כולם גנבים', artist: 'Osher Cohen' },
    ])
  })

  it('respects limit', () => {
    const html = `
      <td class="text mp"><div><a>A</a> - <a>One</a></div></td>
      <td class="text mp"><div><a>B</a> - <a>Two</a></div></td>
    `
    expect(parseKworbChartHtml(html, 1)).toHaveLength(1)
  })
})
